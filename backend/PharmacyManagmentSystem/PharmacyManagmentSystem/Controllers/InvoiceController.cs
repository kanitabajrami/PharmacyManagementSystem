using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Helpers;
using PharmacyManagmentSystem.Models;
using PharmacyManagmentSystem.Repositories;
using System.Security.Claims;

namespace PharmacyManagmentSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize] 
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IInvoiceRepository _invoiceRepo;

        public InvoicesController(ApplicationDbContext db, IInvoiceRepository invoiceRepo)
        {
            _db = db;
            _invoiceRepo = invoiceRepo;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var invoices = await _invoiceRepo.GetAllAsync();
            return Ok(invoices.Select(InvoiceMapper.ToResponseDto));
        }

        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _db.Invoices
                .Include(i => i.User)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Medicine)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
                return NotFound($"Invoice with id {id} not found.");

            // Admin can view any invoice
            if (User.IsInRole("Admin"))
                return Ok(InvoiceMapper.ToResponseDto(invoice));

            // Regular user can only view their own invoice
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("User is not authenticated.");

            if (invoice.UserId != userId)
                return Forbid();

            return Ok(InvoiceMapper.ToResponseDto(invoice));
        }


        //[HttpGet("{id:int}")]
        //[Authorize]
        //public async Task<IActionResult> GetById(int id)
        //{
        //    var invoice = await _invoiceRepo.GetByIdAsync(id);
        //    if (invoice == null) return NotFound($"Invoice with id {id} not found.");
        //    return Ok(InvoiceMapper.ToResponseDto(invoice));
        //}


        //[HttpGet("user/{userId}")]
        //[Authorize(Roles ="Admin")]
        //public async Task<IActionResult> GetByUser(string userId)
        //{
        //    var invoices = await _invoiceRepo.GetByUserAsync(userId);
        //    return Ok(invoices.Select(InvoiceMapper.ToResponseDto));
        //}

        [HttpGet("user/by-username/{username}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest("Username is required.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserName == username);
            if (user == null)
                return NotFound($"User '{username}' not found.");

            var invoices = await _invoiceRepo.GetByUserAsync(user.Id);
            return Ok(invoices.Select(InvoiceMapper.ToResponseDto));
        }


        [HttpGet("range")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByDateRange([FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            if (start > end) return BadRequest("Start date must be before end date.");

            start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
            end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

            var invoices = await _invoiceRepo.GetByDateRangeAsync(start, end);
            return Ok(invoices.Select(InvoiceMapper.ToResponseDto));
        }

        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("User is not authenticated.");

            var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
            if (!userExists) return Unauthorized("Authenticated user does not exist.");

            // 2) Load medicines in one query
            var medicineIds = dto.Items.Select(i => i.MedicineId).Distinct().ToList();
            var medicines = await _db.Medicines
                .Where(m => medicineIds.Contains(m.Id))
                .ToListAsync();

            if (medicines.Count != medicineIds.Count)
                return BadRequest("One or more medicines do not exist.");

            // 3) If prescription provided, validate it
            Prescription? prescription = null;

            if (dto.PrescriptionId.HasValue)
            {
                prescription = await _db.Prescriptions
                    .Include(p => p.PrescriptionMedicines)
                    .FirstOrDefaultAsync(p => p.Id == dto.PrescriptionId.Value);

                if (prescription == null)
                    return NotFound($"Prescription with id {dto.PrescriptionId.Value} not found.");

                if (prescription.Status == PrescriptionStatus.Dispensed)
                    return BadRequest("Prescription is already dispensed.");

                // Allowed quantities (MedicineId -> Quantity allowed)
                var allowed = prescription.PrescriptionMedicines
                    .ToDictionary(x => x.MedicineId, x => x.Quantity);

                foreach (var it in dto.Items)
                {
                    if (!it.MedicineId.HasValue)
                        return BadRequest("MedicineId is required when invoicing from a prescription.");

                    var mid = it.MedicineId.Value;

                    if (!allowed.ContainsKey(mid))
                        return BadRequest($"MedicineId {mid} is not included in this prescription.");

                    if (it.Quantity > allowed[mid])
                        return BadRequest($"Quantity for MedicineId {mid} exceeds prescription allowed amount.");
                }

            }

            // 4) Build invoice entity (server-side prices/totals)
            var invoice = new Invoice
            { 
                UserId = userId,
                PrescriptionId = dto.PrescriptionId,
                DateCreated = DateTime.UtcNow
            };

            // 5) Transaction: stock update + invoice save + prescription update
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                foreach (var it in dto.Items)
                {
                    var med = medicines.First(m => m.Id == it.MedicineId);

                    // Stock is Medicine.Quantity
                    if (med.Quantity < it.Quantity)
                        return BadRequest($"Not enough stock for '{med.Name}'. Available: {med.Quantity}");

                    // reduce stock
                    med.Quantity -= it.Quantity;

                    var unitPrice = med.Price;

                    invoice.InvoiceItems.Add(new InvoiceItem
                    {
                        MedicineId = med.Id,
                        Quantity = it.Quantity,
                        UnitPrice = unitPrice,
                        LineTotal = unitPrice * it.Quantity
                    });
                }

                invoice.TotalAmount = invoice.InvoiceItems.Sum(x => x.LineTotal);

                _db.Invoices.Add(invoice);
                await _db.SaveChangesAsync();

                if (prescription != null)
                {
                    prescription.Status = PrescriptionStatus.Dispensed;
                    await _db.SaveChangesAsync();
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            // Reload with includes so mapper has User + Medicine names
            var created = await _db.Invoices
                .Include(i => i.User)
                .Include(i => i.InvoiceItems).ThenInclude(ii => ii.Medicine)
                .FirstAsync(i => i.Id == invoice.Id);

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, InvoiceMapper.ToResponseDto(created));
        }
    }


}
