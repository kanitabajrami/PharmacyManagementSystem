using Microsoft.AspNetCore.Authorization;
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
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var suppliers = await _supplierRepository.GetAllAsync();
            return Ok(suppliers.Select(SupplierMapper.ToResponseDto));
        }

        
        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id)
        {
            var supplier=await _supplierRepository.GetByIdAsync(id);

            if (supplier == null) return NotFound();
            return Ok(SupplierMapper.ToResponseDto(supplier));

        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] SupplierDto dto)
        {
            try
            {
                var supplier = SupplierMapper.ToEntity(dto);

                await _supplierRepository.AddAsync(supplier);

                var created = await _supplierRepository.GetByIdAsync(supplier.Id);
                if (created == null) return StatusCode(500, "Supplier saved but could not be loaded.");

                return CreatedAtAction(nameof(GetById), new { id = created.Id }, SupplierMapper.ToResponseDto(created));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
        

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] SupplierDto dto)
        {
            try
            {
                var supplier = await _supplierRepository.GetByIdAsync(id);
                if (supplier == null) return NotFound("Supplier not found.");

                SupplierMapper.UpdateEntity(supplier, dto);

                await _supplierRepository.UpdateAsync(supplier);

                var updated = await _supplierRepository.GetByIdAsync(id);
                if (updated == null) return StatusCode(500, "Supplier updated but could not be loaded.");

                return Ok(SupplierMapper.ToResponseDto(updated));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }

        }

        [HttpPut("{id:int}/reactivate")]
        [Authorize]
        public async Task<IActionResult> Reactivate(int id)
        {
            try
            {
                await _supplierRepository.ReactivateAsync(id);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:int}/deactivate")]
        [Authorize]
        public async Task<IActionResult> Deactivate(int id)
        {
            try
            {
                await _supplierRepository.DeactivateAsync(id);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        //only admin can delete supplier
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _supplierRepository.DeleteAsync(id);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }

        }
    }
}
