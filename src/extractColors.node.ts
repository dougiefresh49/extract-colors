import Color from './color/Color'
import { createFinalColor } from './color/FinalColor'
import Extractor from './extract/Extractor'
import { Sorter } from './sort/Sorter'
import { FinalColor } from './types/Color'
import { NodeImageData } from './types/NodeImageData'
import type { NodeOptions, SorterOptions } from "./types/Options"

/**
 * Node exported functions.
 *
 * @example
 * const path = require('path')
 * const { extractColors } = require('extract-colors')
 *
 * const src = path.join(__dirname, './my-image.jpg')
 *
 * extractColors(src)
 *   .then(console.log)
 *   .catch(console.log)
 *
 * @example
 * import { extractColorsFromImageData } from 'extract-colors'
 *
 * const imageData = { data: [0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0xFF] }
 *
 * extractColorsFromImageData(imageData)
 *   .then(console.log)
 *   .catch(console.error)
 *
 * @module Node
 * @memberof node
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createCanvas, loadImage } = require('canvas')

/**
 * Extract ImageData from image.
 * Reduce image to a pixel count.
 *
 * @param {HTMLImageElement} image  Source image
 * @param {Number} pixels  Maximum number of pixels for process
 * @returns {ImageData}
 */
const getImageData = (image: HTMLImageElement, pixels: number) => {
  const currentPixels = image.width * image.height
  const width = currentPixels < pixels ? image.width : Math.round(image.width * Math.sqrt(pixels / currentPixels))
  const height = currentPixels < pixels ? image.height : Math.round(image.height * Math.sqrt(pixels / currentPixels))

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height)
  return context.getImageData(0, 0, width, height)
}

const sortColors = (colors: Color[], pixels: number, options?: SorterOptions) => {
  const sorter = new Sorter(options)
  const list = sorter.process(colors)
  return list.map(color => createFinalColor(color, pixels))
}

/**
 * Extract colors from an ImageData object.
 *
 * @param {ImageData} imageData
 * @param {Object=} options  Optional data
 * @param {String=} options.pixels  Total pixel number of the resized picture for calculation
 * @param {String=} options.distance  From 0 to 1 is the color distance to not have near colors (1 distance is between white and black)
 * @param {String=} options.splitPower  Approximation power in the first color splitting during process (from 2 to 16)
 * @param {String=} options.colorValidator  Callback with test to enable only some colors
 * @returns {Array<Object>}
 */
const extractColorsFromImageData = (imageData: NodeImageData, options?: NodeOptions) => {
  const extractor = new Extractor(options)
  const colors = extractor.extract(imageData.data)
  return sortColors(colors, extractor.pixels, options)
}

/**
 * Extract colors from a path.
 * The image will be downloaded.
 *
 * @param {String} src
 * @param {Object=} options  Optional data
 * @param {String=} options.pixels  Total pixel number of the resized picture for calculation
 * @param {String=} options.distance  From 0 to 1 is the color distance to not have near colors (1 distance is between white and black)
 * @param {String=} options.splitPower  Approximation power in the first color splitting during process (from 2 to 16)
 * @param {String=} options.colorValidator  Callback with test to enable only some colors
 * @returns {Array<Object>}
 */
const extractColorsFromSrc = (src: string, options?: NodeOptions) => (loadImage(src) as Promise<HTMLImageElement>)
  .then((image: HTMLImageElement) => {
    const extractor = new Extractor(options)
    const imageData = getImageData(image, extractor.pixels)
    const colors = extractor.extract(imageData.data)
    return sortColors(colors, extractor.pixels, options)
  })

/**
 * Extract colors from a picture.
 *
 * @param {String|ImageData} picture  Src, Image or ImageData
 * @param {Object=} options  Optional data
 * @param {String=} options.pixels  Total pixel number of the resized picture for calculation
 * @param {String=} options.distance  From 0 to 1 is the color distance to not have near colors (1 distance is between white and black)
 * @param {String=} options.splitPower  Approximation power in the first color splitting during process (from 2 to 16)
 * @param {String=} options.colorValidator  Callback with test to enable only some colors
 * @returns {Array<Object>}
 */
const extractColors = (picture: string | NodeImageData, options?: NodeOptions) => {
  const imageData = picture as NodeImageData
  if (imageData.width && imageData.height && imageData.data && imageData.data.length) {
    return new Promise((resolve: (value: FinalColor[]) => void, reject: (reason: Error) => void) => {
      try {
        resolve(extractColorsFromImageData(imageData, options))
      } catch (error) {
        reject(error as Error)
      }
    })
  }

  return extractColorsFromSrc(picture as string, options)
}

export {
  extractColorsFromImageData,
  extractColorsFromSrc,
  extractColors
}

export default extractColors