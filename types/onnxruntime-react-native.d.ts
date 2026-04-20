declare module 'onnxruntime-react-native' {
  export class Tensor {
    constructor(type: string, data: Float32Array | Int32Array | Uint8Array | number[] | ArrayLike<number>, dims: number[]);
    data: Float32Array | Int32Array | Uint8Array | ArrayLike<number>;
    dims: number[];
  }

  export class InferenceSession {
    inputNames: string[];
    outputNames: string[];
    static create(modelUri: string): Promise<InferenceSession>;
    run(feeds: Record<string, Tensor>): Promise<Record<string, { data: Float32Array | ArrayLike<number> }>>;
  }
}
