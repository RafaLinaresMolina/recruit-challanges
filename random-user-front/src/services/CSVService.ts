export class CSVService {
    generateCSVContent<T>(data: T[], headers: (keyof T)[]): string {
      const header = headers.join(',') + '\n';
      const csv = data
        .map(item =>
          headers.map(header => (item as Record<keyof T, string>)[header]).join(',')
        )
        .join('\n');
      return header + csv;
    }
  }