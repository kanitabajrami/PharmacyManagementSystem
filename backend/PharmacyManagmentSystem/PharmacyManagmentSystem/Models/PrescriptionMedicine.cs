namespace PharmacyManagmentSystem.Models
{
    //join table for many-to-many between prescription and medicine
    public class PrescriptionMedicine
    {
        public int PrescriptionId { get; set; }
        public Prescription Prescription { get; set; }

        public int MedicineId { get; set; }
        public Medicine Medicine { get; set; }

        public int Quantity { get; set; }
    }
}
