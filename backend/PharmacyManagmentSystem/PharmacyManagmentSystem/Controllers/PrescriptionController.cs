using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Helpers;
using PharmacyManagmentSystem.Models;
using PharmacyManagmentSystem.Repositories;
using System.Net.WebSockets;

namespace PharmacyManagmentSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrescriptionController : ControllerBase
    {
        private readonly IPrescriptionRepository _repository;
        private readonly PrescriptionHelper _helper;

        public PrescriptionController(IPrescriptionRepository repository, PrescriptionHelper helper)
        {
            _repository = repository;
            _helper = helper;
        }

        // GET: api/Prescription
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var prescriptions = await _repository.GetAllAsync();
            return Ok(prescriptions.Select(PrescriptionMapper.toDto));
        }

        // GET: api/Prescription/{id}
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id)
        {
            var prescription = await _repository.GetByIdAsync(id);
            if (prescription == null) 
                return NotFound("Prescription not found");
            return Ok(PrescriptionMapper.toDto(prescription));
        }

        // POST: api/Prescription
        [HttpPost]
        [Authorize(Roles ="Admin")]
        public async Task<IActionResult> Create([FromBody] PrescriptionDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            try
            {
                var prescription = PrescriptionMapper.ToEntity(dto);        // Map DTO to entity

                await _helper.HandleMissingMedicines(prescription, dto);        // Check for missing medicine and log

                await _repository.AddAsync(prescription);       // Save changes
                return CreatedAtAction(nameof(GetById), new { id = prescription.Id }, PrescriptionMapper.toDto(prescription));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to import prescription: {ex.Message}");
            }
            }

        // PUT: api/Prescription/{id}
        //[HttpPut("{id}")]
        
        //public async Task<IActionResult> Update(int id, [FromBody] PrescriptionDto dto)
        //{
        //    if(!ModelState.IsValid)
        //        return BadRequest(ModelState);
        //    try
        //    {
        //        var existing = await _repository.GetByIdAsync(id);      // Get existing prescription
        //        if (existing == null)
        //            return NotFound("Prescription not found");

        //        PrescriptionMapper.UpdateEntity(existing, dto);         // Update entity with DTO

        //        await _helper.HandleMissingMedicines(existing, dto);        // Check missing medicine and log

        //        await _repository.UpdateAsync(existing);        //Save changes
        //        return Ok(PrescriptionMapper.toDto(existing));
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, $"Failed to update prescription: {ex.Message}");
        //    }
        //}

        // DELETE: api/Prescription/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles ="Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _repository.DeleteAsync(id);
            return NoContent();
        }

        // GET: api/Prescription/patient/{patientId}
        [HttpGet("patient/{patientId}")]
        [Authorize(Roles ="User")]
        public async Task<IActionResult> GetByPatient(string patientId)
        {
            var prescriptions = await _repository.GetByPatientAsync(patientId);
            return Ok(prescriptions.Select(PrescriptionMapper.toDto));
        }

        // GET: api/Prescription/doctor/{doctorName}
        [HttpGet("doctor/{doctorName}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetByDoctor(string doctorName)
        {
            var prescriptions = await _repository.GetByDoctorAsync(doctorName);
            return Ok(prescriptions.Select(PrescriptionMapper.toDto));
        }

        //// GET: api/Prescription/expired
        //[HttpGet("expired")]
        //public async Task<IActionResult> GetExpired()
        //{
        //    var expired = await _repository.GetExpiredPrescriptions();
        //    return Ok(expired);
        //}

        //// GET: api/Prescription/{id}/isExpired
        //[HttpGet("{id}/isExpired")]
        //public async Task<IActionResult> IsExpired(int id)
        //{
        //    var result = await _repository.IsExpiredAsync(id);
        //    return Ok(result);
        //}
    }
}
