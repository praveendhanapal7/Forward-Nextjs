import "@/styles/ClientsSection.css";

const clientSlots = [
  { id: 4,  name: "Binary Computer",   logo: "/assets/Binary Computer.jpg" },
  { id: 2,  name: "BestBuy IT World",  logo: "/assets/BestBuy IT World.jpg" },
  { id: 1,  name: "Laptop Store",      logo: "/assets/LaptopStore.jpg" },
  { id: 3,  name: "BestBuy Refurb",    logo: "/assets/BestBuy Refurb.jpg" },
  { id: 5,  name: "DKS System",        logo: "/assets/DKS System.jpg" },
  { id: 6,  name: "JP Computers",      logo: "/assets/JP Computers.jpg" },
  { id: 7,  name: "Master Computer",   logo: "/assets/Master Computer.jpg" },
  { id: 8,  name: "Need 4 It",         logo: "/assets/Need 4 It.jpg" },
  { id: 9,  name: "System to System",  logo: "/assets/S2s.jpg" },
  { id: 10, name: "Infocom System",    logo: "/assets/Infocom System.png" },
  { id: 11, name: "Binary Refurb",     logo: "/assets/Binary Refurb.jpg" },
  { id: 12, name: "Ammachis Masala",   logo: "/assets/Ammachis Masala.avif" },
  { id: 13, name: "Cloud 9",           logo: "/assets/Cloud 9.jpg" },
  { id: 14, name: "Kidding Mart",      logo: "/assets/Kidding Mart.jpg" },
  { id: 15, name: "SJ Chicken",        logo: "/assets/SJ Chicken.jpg" },
];

export default function ClientsSection() {
  return (
    <section className="ClientsSection">
      <div className="ClientsTop">
        <p className="ClientsTag">Our Clients</p>
        <h2 className="ClientsTitle">Trusted by Growing Brands</h2>
        <p className="ClientsSubtitle">
          Our current clients are highly satisfied with our service quality and
          response speed.
        </p>
      </div>
      <div className="ClientLogoGrid">
        {clientSlots.map((client, index) => (
          <article
            key={client.id}
            className="ClientLogoCard"
          >
            <img
              src={client.logo}
              alt={client.name}
              className="ClientLogoImage"
              style={{ borderRadius: "20px" }}
            />
            <p>{client.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
