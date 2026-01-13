using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
    public class SupplierDto
    {
        [Required]
        public string Name { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public bool IsActive { get; set; } = true;

    }

    public class SupplierResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; } = true;
        public int MedicinesCount { get; set; }
    }

}
