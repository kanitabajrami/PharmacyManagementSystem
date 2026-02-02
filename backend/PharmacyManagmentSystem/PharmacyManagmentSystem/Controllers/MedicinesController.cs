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
    public class MedicinesController : ControllerBase
    {
        private readonly IMedicineRepository _repo;
        private readonly ISupplierRepository _supplierRepository;

        public MedicinesController(IMedicineRepository repo, ISupplierRepository supplierRepository)
        {
            _repo = repo;
            _supplierRepository = supplierRepository;
        }


        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var medicines = await _repo.GetAllAsync();
            return Ok(medicines.Select(MedicineMapper.ToResponseDto));
        }

        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id)
        {
            var medicine = await _repo.GetByIdAsync(id);
            if (medicine == null) return NotFound();
            return Ok(MedicineMapper.ToResponseDto(medicine));
        }


        [HttpPost]
        [Authorize(Roles ="Admin")]
        public async Task<IActionResult> Create([FromBody] MedicineDto dto)
        {

            try
            {
                var supplier = await _supplierRepository.GetByIdAsync(dto.SupplierId);
                if (supplier == null) return BadRequest("Supplier not found.");

                var entity = MedicineMapper.ToEntity(dto);

                await _repo.AddAsync(entity);

                var created = await _repo.GetByIdAsync(entity.Id);
                if (created == null) return StatusCode(500, "Medicine saved but could not be loaded.");


                return CreatedAtAction(nameof(GetById), new { id = created.Id }, MedicineMapper.ToResponseDto(created));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] MedicineDto dto)
        {
            try
            {
                var existing = await _repo.GetByIdAsync(id);
                if (existing == null) return NotFound($"Medicine with id {id} not found.");

                var supplier = await _supplierRepository.GetByIdAsync(dto.SupplierId);
                if (supplier == null) return BadRequest("Supplier not found.");

                MedicineMapper.UpdateEntity(existing, dto);

                await _repo.UpdateAsync(existing);

                var updated = await _repo.GetByIdAsync(id);
                if (updated == null) return StatusCode(500, "Medicine updated but could not be loaded.");

                return Ok(MedicineMapper.ToResponseDto(updated));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message); 
            }

        }

        [HttpDelete("{id:int}")]
        [Authorize (Roles="Admin")]
        public async Task<IActionResult>Delete(int id)
        {
                var medicine = await _repo.GetByIdAsync(id);

                if (medicine == null) return NotFound("Medicine not found");

                await _repo.DeleteAsync(id);

                return NoContent();
           
        }

        [HttpGet("search")]
        [Authorize]
        public async Task<IActionResult>Search([FromQuery] string? name,[FromQuery] string? category)
        {
            var medicines= await _repo.SearchAsync(name, category);
            return Ok(medicines.Select(MedicineMapper.ToResponseDto));
        }

        [HttpGet("low-stock")]
        [Authorize]
        public async Task<IActionResult>LowStock([FromQuery] int threshold = 10)
        {
            var medicines=await _repo.GetLowStockAsync(threshold);
            return Ok(medicines.Select(MedicineMapper.ToResponseDto));
        }

        [HttpGet("expiring-soon")]
        [Authorize]
        public async Task<IActionResult> ExpiringSoon([FromQuery] int days = 30)
        {
            var expiring=await _repo.GetExpiringSoonAsync(days);
            return Ok(expiring.Select(MedicineMapper.ToResponseDto));
        }
    }
}
