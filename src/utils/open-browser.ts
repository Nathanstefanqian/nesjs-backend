import { exec } from 'child_process';

export function openBrowser(url: string) {
  const platform = process.platform;
  let command: string;

  switch (platform) {
    case 'darwin': // macOS
      command = `open ${url}`;
      break;
    case 'win32': // Windows
      command = `start ${url}`;
      break;
    default: // Linux
      command = `xdg-open ${url}`;
      break;
  }

  exec(command, (error) => {
    if (error) {
      console.log(`无法自动打开浏览器: ${error.message}`);
      console.log(`请手动访问: ${url}`);
    }
  });
}
