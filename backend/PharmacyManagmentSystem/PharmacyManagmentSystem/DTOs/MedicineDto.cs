using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
    public class MedicineDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public string Category { get; set; }

        [Range(0,double.MaxValue)]
        public decimal Price { get; set; }  

        [Range(0,int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        public int SupplierId {  get; set; }
    }

    public class MedicineResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }

        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
    }

}
