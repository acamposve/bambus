const soporte = require('tingelmar-support');

const report = (level, data) => {
  let message = '';
  if (data.message) {
    message = `${data.message}\`\`\``;
    message += `\`\`\`json\n${JSON.stringify(data.stack, null, 1)}`;
  } else {
    message += `json\n${JSON.stringify(data.stack, null, 1)}`;
  }
  return soporte.discord(level, data.title, message);
};

const reportError = (data: { title: string; message?: string; stack: Record<any, any> }) => {
  return report('error', data);
};

const reportInfo = (data: { title: string; message?: string; stack: Record<any, any> }) => {
  return report('info', data);
};

const reportWarn = (data: { title: string; message?: string; stack: Record<any, any> }) => {
  return report('warn', data);
};

const reportSimple = (text) => {
  return soporte.discordSimple(text);
};

export { reportError, reportInfo, reportWarn, reportSimple };
