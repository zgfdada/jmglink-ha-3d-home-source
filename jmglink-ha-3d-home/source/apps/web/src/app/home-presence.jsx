import { a as React } from "../vendor/react.js";

export default function HomePresence({ users, fallback }) {
  if (!users.length) return null;
  const visible = users.slice(0, 3);
  const remaining = users.length - visible.length;
  return (
    <section
      className="home-presence"
      aria-label={`在家人员与跟踪器 ${users.length} 位`}
    >
      {visible.map(({ id, picture }) => (
        <span className="home-presence-avatar" key={id}>
          <span className="home-presence-fallback" aria-hidden="true">
            {fallback}
          </span>
          {picture && (
            <img
              src={"./api/sidebar-services/picture/" + encodeURIComponent(id)}
              alt=""
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
          <span className="home-presence-dot" aria-label="在家" />
        </span>
      ))}
      {remaining > 0 && (
        <span className="home-presence-count">+{remaining}</span>
      )}
    </section>
  );
}
