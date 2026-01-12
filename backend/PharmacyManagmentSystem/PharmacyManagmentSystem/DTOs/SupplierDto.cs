using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
    public class SupplierDto
    {
        public int Id { get; set; }            // used in responses
        public string Name { get; set; } = string.Empty;
        public string? ContactInfo { get; set; }

        // Optional: returned in GET, ignored in POST
        public int MedicinesCount { get; set; }
    }
}
