self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "H3 Studio", body: "A video generation has completed." };
  }
  event.waitUntil(self.registration.showNotification(payload.title || "H3 Studio: video ready", {
    body: payload.body || "A video generation has completed.",
    icon: "/icon",
    badge: "/icon",
    tag: payload.tag || "h3-studio-generation",
    data: { url: payload.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.focus();
    return self.clients.openWindow(event.notification.data?.url || "/");
  })());
});
