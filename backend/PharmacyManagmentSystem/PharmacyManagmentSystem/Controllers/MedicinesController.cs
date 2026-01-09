using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.Models;
using PharmacyManagmentSystem.Repositories;

namespace PharmacyManagmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicinesController:ControllerBase
    {
        private readonly IMedicineRepository _repo;

        public MedicinesController(IMedicineRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var medicines=await _repo.GetAllAsync();
            return Ok(medicines);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var medicine = await _repo.GetByIdAsync(id);
            if (medicine == null) return NotFound();
            return Ok(medicine);
        }


        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Medicine medicine)
        {
            try
            {
                await _repo.AddAsync(medicine);
                return CreatedAtAction(nameof(GetById), new { id = medicine.Id }, medicine);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
