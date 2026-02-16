import { FileSizePipe } from './file-size.pipe';

describe('FileSizePipe', () => {
  let pipe: FileSizePipe;

  beforeEach(() => {
    pipe = new FileSizePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "-" for null', () => {
    expect(pipe.transform(null)).toBe('-');
  });

  it('should return "-" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('-');
  });

  it('should return bytes with B suffix for values < 1024', () => {
    expect(pipe.transform(500)).toBe('500 B');
  });

  it('should return KB for values >= 1024 and < 1048576', () => {
    expect(pipe.transform(2048)).toBe('2.0 KB');
  });

  it('should return MB for values >= 1048576', () => {
    expect(pipe.transform(1048576)).toBe('1.0 MB');
  });

  it('should return MB for large values', () => {
    expect(pipe.transform(5242880)).toBe('5.0 MB');
  });
});
