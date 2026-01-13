using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.Models;
using PharmacyManagmentSystem.Repositories;

namespace PharmacyManagmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceRepository _repository;

        public InvoiceController(IInvoiceRepository repository)
        {
            _repository = repository;
        }

        // Get: api/Invoice
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var invoices = await _repository.GetAllAsync();
            return Ok(invoices);
        }

        // GET: api/Invoice/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _repository.GetByIdAsync(id);
            if (invoice == null) return NotFound("Invoice not found");

            return Ok(invoice);
        }

        // POST: api/Invoice
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Invoice invoice)
        {
            await _repository.AddAsync(invoice);
            return CreatedAtAction(nameof(GetById), new {id = invoice.Id}, invoice);
        }

        // PUT: api/Invoice/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Invoice invoice)
        {
            if (id != invoice.Id) return BadRequest("Invoice id not found");
            
            await _repository.UpdateAsync(invoice);
            return Ok(invoice);
        }

        // DELETE: api/Invoice/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _repository.DeleteAsync(id);
            return NoContent();
        }

        // GET: api/Invoice/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var invoices = await _repository.GetByUserAsync(userId);
            return Ok(invoices);
        }

        // GET: api/Invoice/range?start=2026-01-01&end=2026-01-31
        [HttpGet("range")]
        public async Task<IActionResult> GetByDateRange(DateTime start, DateTime end)
        {
            var invoices = await _repository.GetByDateRangeAsync(start, end);
            return Ok(invoices);
        }

        //// GET: api/Invoice/{id}/total
        //[HttpGet("{id}/total")]
        //public async Task<IActionResult> GetTotal(int id)
        //{
        //    var total = await _repository.GetTotalAmountAsync(id);
        //    return Ok(total);
        //}
    }
}
