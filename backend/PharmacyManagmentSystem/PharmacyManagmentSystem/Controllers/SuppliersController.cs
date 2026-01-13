using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Helpers;
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
            return Ok(suppliers.Select(SupplierMapper.ToResponseDto));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var supplier=await _supplierRepository.GetByIdAsync(id);

            if (supplier == null) return NotFound();
            return Ok(SupplierMapper.ToResponseDto(supplier));

        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SupplierDto dto)
        {
           
            var supplier= SupplierMapper.ToEntity(dto);

            await _supplierRepository.AddAsync (supplier);

            var created = await _supplierRepository.GetByIdAsync(supplier.Id);
            if (created == null) return StatusCode(500, "Supplier saved but could not be loaded.");


            return CreatedAtAction(nameof(GetById), new { id = created.Id }, SupplierMapper.ToResponseDto(created));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SupplierDto dto)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null) return NotFound();

            SupplierMapper.UpdateEntity(supplier,dto);

            await _supplierRepository.UpdateAsync(supplier);

            var updated = await _supplierRepository.GetByIdAsync(id);
            if (updated == null) return StatusCode(500, "Supplier updated but could not be loaded.");

            return Ok(SupplierMapper.ToResponseDto(updated));

        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var supplier= await _supplierRepository.GetByIdAsync(id);

            if (supplier == null) return NotFound($"Supplier with id {id} not found.");

            if (supplier.Medicines.Any())
                throw new ArgumentException("Cannot delete supplier because it has medicines.");


            await _supplierRepository.DeleteAsync(id);
            return NoContent();

        }
    }
}
