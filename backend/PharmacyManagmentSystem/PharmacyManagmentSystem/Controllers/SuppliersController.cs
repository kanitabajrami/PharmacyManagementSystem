using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.Models;
using PharmacyManagmentSystem.Repositories;

namespace PharmacyManagmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierRepository _supplierRepository;
        public SuppliersController(ISupplierRepository repo)
        {
            _supplierRepository = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var suppliers = await _supplierRepository.GetAllAsync();
            return Ok(suppliers);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var supplier=await _supplierRepository.GetByIdAsync(id);
            if (supplier == null) return NotFound();
            return Ok(supplier);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Supplier supplier)
        {
            await _supplierRepository.AddAsync (supplier);
            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
        }
    }
}
