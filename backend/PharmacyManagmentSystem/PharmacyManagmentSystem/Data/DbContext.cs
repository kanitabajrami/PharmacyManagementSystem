namespace PharmacyManagmentSystem.Data
{
    public class DbContext
    {
        private object оptions;

        public DbContext(object оptions)
        {
            this.оptions = оptions;
        }
    }
}