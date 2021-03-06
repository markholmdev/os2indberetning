namespace Infrastructure.DataAccess.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddedAuditlog : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "Auditlogs",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Date = c.String(unicode: false),
                        User = c.String(unicode: false),
                        Location = c.String(unicode: false),
                        Controller = c.String(unicode: false),
                        Action = c.String(unicode: false),
                        Parameters = c.String(unicode: false),
                        WrittenToLogFile = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.Id)                ;
            
        }
        
        public override void Down()
        {
            DropTable("Auditlogs");
        }
    }
}
