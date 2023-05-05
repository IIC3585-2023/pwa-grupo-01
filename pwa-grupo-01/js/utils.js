export function getTimeAgo(timestamp, now = Date.now()) {
  const difference = now - timestamp;
  const seconds = Math.floor(difference / 1000);

  let message;
  if (seconds < 60) {
    message = `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  } else if (seconds < 60 * 60) {
    const minutes = Math.floor(seconds / 60);
    message = `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (seconds < 60 * 60 * 24) {
    const hours = Math.floor(seconds / (60 * 60));
    message = `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else {
    const days = Math.floor(seconds / (60 * 60 * 24));
    message = `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return message;
}

// @benjavicente mira lo funcional de esta funcion
export const getUniqueName = (file) => {
  console.log(file);
  const parts = file.name.split(".");
  const extension = parts.slice(-1)[0];
  const filename = parts.slice(0, -1).join(".");
  const id = Date.now();
  return `${filename}-${id}.${extension}`;
};
