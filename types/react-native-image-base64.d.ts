declare module "react-native-image-base64" {
  export default class ImgToBase64 {
    static getBase64String(uri: string): Promise<string>;
    static encode(data: string): string;
    static decode(data: string): string;
    static encodeFromByteArray(byteArray: Uint8Array): string;
  }
}
