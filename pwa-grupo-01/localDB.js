import { createSignal } from "./js/ui.js";

// Open a connection to the database
let localDB;
const requestlocalDB = indexedDB.open("posts", 1);

requestlocalDB.onupgradeneeded = function (event) {
  // Create an object store for the posts
  const localDB = event.target.result;
  const objectStore = localDB.createObjectStore("posts", { keyPath: "id", autoIncrement: true });
};

requestlocalDB.onsuccess = function (event) {
  localDB = event.target.result;
};

requestlocalDB.onerror = function (event) {
  console.log("Error opening database");
};

const [cacheData, setCacheData] = createSignal([]);
requestlocalDB.onsuccess = function (event) {
  localDB = event.target.result;

  // Retrieve all the posts from the object store
  const transaction = localDB.transaction("posts", "readonly");
  const objectStore = transaction.objectStore("posts");
  const request = objectStore.getAll();

  request.onsuccess = function (event) {
    const posts = event.target.result;
    console.log("All posts:", posts);
    setCacheData(posts);
  };

  request.onerror = function (event) {
    console.log("Error getting posts");
  };
};

function cachePost(post) {
  const transaction = localDB.transaction(["posts"], "readwrite");
  const objectStore = transaction.objectStore("posts");

  const request = objectStore.add(post);

  request.onsuccess = function (event) {
    console.log("Post saved");
  };

  request.onerror = function (event) {
    console.log("Error saving post");
  };
}

async function cacheImageData(imageURL) {
  return new Promise((resolve, reject) => {
    const requestlocalDB = indexedDB.open("images", 1);
    console.log("cacheImageData", imageURL);
    requestlocalDB.onsuccess = function (event) {
      localDB = event.target.result;
      console.log("cacheImageData", imageURL);

      const transaction = localDB.transaction("images", "readonly");
      const objectStore = transaction.objectStore("images");
      const request = objectStore.get(imageURL); // use get() to retrieve a specific image

      request.onsuccess = function (event) {
        const image = event.target.result;
        console.log("Retrieved image:", image);
        resolve(image); // resolve the Promise with the retrieved image
      };

      request.onerror = function (event) {
        console.log("Error getting image");
        reject(event); // reject the Promise with the error event
      };
    };
  });
}

function cacheImage(imageUrl) {
  // Open a connection to the database
  const request = indexedDB.open("images", 1);

  request.onupgradeneeded = function (event) {
    // Create an object store for the images
    const localDB = event.target.result;
    const objectStore = localDB.createObjectStore("images", { keyPath: "url" });
  };

  request.onsuccess = function (event) {
    const localDB = event.target.result;

    // Check if the image is already in the database
    const transaction = localDB.transaction("images", "readonly");
    const objectStore = transaction.objectStore("images");
    const request = objectStore.get(imageUrl);

    request.onsuccess = function (event) {
      const image = event.target.result;

      if (image) {
        // If the image is already in the database, return it
        console.log("Image retrieved from cache");
        return image;
      } else {
        // If the image is not in the database, fetch it and store it
        fetch(imageUrl)
          .then((response) => response.blob())
          .then((blob) => {
            const transaction = localDB.transaction("images", "readwrite");
            const objectStore = transaction.objectStore("images");
            const request = objectStore.put({ url: imageUrl, blob });

            request.onsuccess = function (event) {
              console.log("Image cached");
            };

            request.onerror = function (event) {
              console.log("Error caching image");
            };
          });
      }
    };

    request.onerror = function (event) {
      console.log("Error retrieving image from cache");
    };
  };

  request.onerror = function (event) {
    console.log("Error opening database");
  };
}

function uncachePost(id, imageURL) {
  deleteCache("images", imageURL);
  deleteCache("posts", id);
}

function deleteCache(type, id) {
  // Open a connection to the database
  const requestlocalDB = indexedDB.open(type, 1);
  requestlocalDB.onsuccess = function (event) {
    const localDB = event.target.result;

    const transaction = localDB.transaction(type, "readwrite");
    const objectStore = transaction.objectStore(type);
    const request = objectStore.delete(id);

    request.onsuccess = function (event) {
      console.log("Deleted", id);
      console.log(type, "deleted successfully");
    };

    request.onerror = function (event) {
      console.log("Error deleting", type);
    };
  };

  requestlocalDB.onerror = function (event) {
    console.log("Error opening database");
  };
}

export { cachePost, cacheImage, cacheData, cacheImageData, uncachePost };
