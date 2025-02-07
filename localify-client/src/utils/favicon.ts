export const updateFavicon = (imageUrl: string | null) => {
  const link =
    (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
    document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "shortcut icon";

  if (imageUrl) {
    // Create a temporary canvas to convert the album art to a favicon
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 32;
    canvas.height = 32;

    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, 32, 32);
        link.href = canvas.toDataURL("image/png");
      }
    };
    img.src = imageUrl;
  } else {
    // Reset to default favicon
    link.href = "/vite.svg";
  }

  document.head.appendChild(link);
};
