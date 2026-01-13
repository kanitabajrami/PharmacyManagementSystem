using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.Models;
using PharmacyManagmentSystem.Repositories;

namespace PharmacyManagmentSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrescriptionController : ControllerBase
    {
        private readonly IPrescriptionRepository _repository;

        public PrescriptionController(IPrescriptionRepository repository)
        {
            _repository = repository;
        }

        // GET: api/Prescription
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var prescriptions = await _repository.GetAllAsync();
            return Ok(prescriptions);
        }

        // GET: api/Prescription/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var prescription = await _repository.GetByIdAsync(id);
            return Ok(prescription);
        }

        // POST: api/Prescription
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Prescription prescription)
        {
            await _repository.AddAsync(prescription);
            return CreatedAtAction(nameof(GetById), new {id =  prescription.Id}, prescription);
        }

        // PUT: api/Prescription/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Prescription prescription)
        {
            if (id != prescription.Id) return BadRequest("ID mismatch");
            await _repository.UpdateAsync(prescription);
            return Ok(prescription);
        }

        // DELETE: api/Prescription/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _repository.DeleteAsync(id);
            return NoContent();
        }

        // GET: api/Prescription/patient/{patientId}
        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetByPatient(string patientId)
        {
            var prescriptions = await _repository.GetByPatientAsync(patientId);
            return Ok(prescriptions);
        }

        // GET: api/Prescription/doctor/{doctorName}
        [HttpGet("doctor/{doctorName}")]
        public async Task<IActionResult> GetByDoctor(string doctorName)
        {
            var prescriptions = await _repository.GetByDoctorAsync(doctorName);
            return Ok(prescriptions);
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
