import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';

@Injectable()
export class OcrService {
  async #prepareImage(image: Buffer): Promise<Buffer> {
    return await sharp(image)
      //.trim({ background: { r: 43, g: 45, b: 66, alpha: 1 } })
      .greyscale()
      .linear(1.5, -0.2)
      .resize({ width: 1200, fit: 'inside', kernel: 'lanczos3' })
      .toBuffer();
  }

  async extract(image: Buffer): Promise<string> {
    const processedImage = await this.#prepareImage(image);

    const worker = await createWorker('ces', 1, {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
      cacheMethod: 'write',
    });
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });

    const {
      data: { text },
    } = await worker.recognize(processedImage);

    await worker.terminate();
    return text.trim();
  }
}
