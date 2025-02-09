export const config = {
  STORAGE_PATH: process.env.STORAGE_PATH || './localify-storage',
  MEDIA_PATH: process.env.MEDIA_PATH || './localify-media',
  DB_NAME: process.env.DB_NAME || 'localify.db',
  JWT_SECRET:
    process.env.JWT_SECRET ||
    '31329ac568a5fedd232972e07c4652b9f0363afa76438b9ae322cd895308ec8bcdea6403b2b35b540febde5bc350e699794bc3430567c1bfbf85f57840c71efc5bb2ee433caf91fab68b676153fdfc367041457d63ba7a9b6b4d6c31cc225579d36530b8b76ec8fa55f2bb352cdb67ad4c0f187258b8329fa7600e4626c2ac30015fe72c4ea2260dc1866386a9cbce7a605e5df75897d3e5571f2c9341e805fa0845d10aadf3dae32971994c649538bcd22fec41a24a675d7a33d4db9f77ee2b005a0b6cc000f5755afcc81e4b9a117db53a55ca0eace5086c2b48e256c57578dd12ee4ee5a892e57f42574c',
};
