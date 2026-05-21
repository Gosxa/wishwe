import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <p className="hero-eyebrow">Infrastructure · Django · PostgreSQL</p>
      <h1 className="hero-title">
        Wishwe is<br />
        <em>almost here.</em>
      </h1>
      <p className="hero-sub">
        Backend deployed. Database connected. Pipeline ready.<br />
        Frontend coming soon.
      </p>
    </section>
  )
}
