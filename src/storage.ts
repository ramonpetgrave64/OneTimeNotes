import crypto from 'crypto'


export interface InMemoryProps {
    key: string;
    iv : string;
    notes: { [iv: string]: string };
  }
  

export class InMemory {
    static internal_encoding : crypto.BinaryToTextEncoding = 'base64';
    static external_encoding : BufferEncoding = 'utf8'
    static algorithm = 'aes-256-gcm';
  
    key!: string;
    iv!: string;
    notes!: { [iv: string]: string };
    
    constructor(props: InMemoryProps | null = null) {
      if (props) {
        this.key = InMemory.decode(props.key);
        this.iv = props.iv;
        this.notes = props.notes;
      } else {
        this.key = InMemory.generateKey();
        this.iv = InMemory.generateIv();
        this.notes = {};
      }
    }
  
    static encode(input: any) : string {
      return Buffer.from(input, InMemory.external_encoding).toString(InMemory.internal_encoding);
    }
  
    static decode(output: any) : string {
      return Buffer.from(output, InMemory.internal_encoding).toString(InMemory.external_encoding);
    }
  
    static encrypt(text: string, key: string, iv: string) {
      const cipher = crypto.createCipheriv(
        InMemory.algorithm, 
        Buffer.from(key, InMemory.internal_encoding), 
        Buffer.from(iv, InMemory.internal_encoding)
      );
      const ciphertext = cipher.update(
        text, InMemory.external_encoding, 
        InMemory.internal_encoding
      ) + cipher.final(InMemory.internal_encoding);
      return ciphertext;
    }
  
    static decrypt(text: string, key: string, iv: string) {
      const decipher = crypto.createDecipheriv(
        InMemory.algorithm, 
        Buffer.from(key, InMemory.internal_encoding), 
        Buffer.from(iv, InMemory.internal_encoding)
      );
      const plaintext = decipher.update(
        text, InMemory.internal_encoding, 
        InMemory.external_encoding
      ) // + decipher.final(InMemory.external_encoding); // works with cbc, but not gcm?
      return plaintext;
    }
  
    storeNote(note: string) : string {
      const material = {
        key: InMemory.generateKey(),
        iv: InMemory.generateIv()
      };
      const ciphertext = InMemory.encrypt(note, material.key, material.iv);
      this.notes[material.iv] = ciphertext;
      const link = InMemory.encode(
        InMemory.encrypt(JSON.stringify(material), this.key, this.iv)
      );
      return link;
    }
  
    retrieveNote(link: string) : string {
      var material;
      try {
        material = JSON.parse(
          InMemory.decrypt(InMemory.decode(link), this.key, this.iv)
        );
      } catch(e) {
        throw new Error(`Unable to decrypt link ${link}`);
      }
      if (material.iv in this.notes) {
        const ciphertext = this.notes[material.iv];
        const note = InMemory.decrypt(ciphertext, material.key, material.iv);
        delete this.notes[material.iv];
        return note
      } else {
        throw new Error(`No note for link ${link}`);
      };
    }
  
    static generateKey(bytes: number = 32): string {
      return InMemory.encode(this.generateRandomBytes(bytes));
    }
  
    static generateIv(bytes: number = 16) : string {
      return InMemory.encode(this.generateRandomBytes(bytes));
    }
  
    static generateRandomBytes(bytes: number) : Buffer {
      return crypto.randomBytes(bytes);
    }
  }