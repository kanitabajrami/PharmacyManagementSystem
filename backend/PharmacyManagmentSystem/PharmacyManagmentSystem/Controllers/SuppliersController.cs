using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.DTOs;
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

            var dto = new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactInfo = supplier.ContactInfo,
                MedicinesCount = supplier.Medicines?.Count ?? 0
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SupplierDto dto)
        {
            var supplier = new Supplier
            {
                Name = dto.Name,
                ContactInfo = dto.ContactInfo
            };

            await _supplierRepository.AddAsync (supplier);

            dto.Id = supplier.Id;
            dto.MedicinesCount = 0;

            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, dto);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SupplierDto dto)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null) return NotFound();

            supplier.Name = dto.Name;
            supplier.ContactInfo = dto.ContactInfo;

            await _supplierRepository.UpdateAsync(supplier);

            dto.Id = supplier.Id;
            dto.MedicinesCount = supplier.Medicines?.Count ?? 0;

            return Ok(dto);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var supplier= await _supplierRepository.GetByIdAsync(id);

            if (supplier == null) return NotFound($"Supplier with id {id} not found.");

            await _supplierRepository.DeleteAsync(id);
            return NoContent();

        }
    }
}
