import ImageKit from '@imagekit/nodejs';

const urlEndpoint = import.meta.env.IMAGEKIT_URL_ENDPOINT;

const imagekit = new ImageKit({
  privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY
});

export { imagekit, urlEndpoint };