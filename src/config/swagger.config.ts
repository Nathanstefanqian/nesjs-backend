import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerAutoLoginOptions {
  autoLoginEmail?: string;
  autoLoginPassword?: string;
}

const buildCustomJsStr = (
  autoLoginEmail?: string,
  autoLoginPassword?: string,
) => `
  const autoLoginConfig = ${JSON.stringify({
    email: autoLoginEmail || '',
    password: autoLoginPassword || '',
  })};
  const securityName = 'JWT-auth';
  const authorize = (token) => {
    const ui = window.ui;
    if (!ui) {
      return false;
    }
    ui.authActions.authorize({
      [securityName]: {
        name: securityName,
        schema: { type: 'http', in: 'header', scheme: 'bearer', bearerFormat: 'JWT' },
        value: token
      }
    });
    return true;
  };
  const originalFetch = window.fetch;
  window.fetch = function (url, options) {
    return originalFetch.apply(this, arguments).then(async (response) => {
      if (url.includes('/auth/login') && response.ok) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          const token = data.data?.access_token || data.access_token;
          if (token) {
            if (!authorize(token)) {
              window.__AUTO_TOKEN__ = token;
            }
          }
        } catch (e) {
          console.error('Auto-auth failed', e);
        }
      }
      return response;
    });
  };
  const tryAuthorizeFromCache = () => {
    if (window.__AUTO_TOKEN__) {
      const ok = authorize(window.__AUTO_TOKEN__);
      if (ok) {
        window.__AUTO_TOKEN__ = null;
        return true;
      }
    }
    return false;
  };
  const runAutoLogin = () => {
    if (!autoLoginConfig.email || !autoLoginConfig.password) {
      return;
    }
    fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: autoLoginConfig.email,
        password: autoLoginConfig.password
      })
    });
  };
  window.addEventListener('load', function() {
    const interval = setInterval(() => {
      const infoContainer = document.querySelector('.swagger-ui .info');
      if (infoContainer) {
         clearInterval(interval);
         if (document.getElementById('sse-btn')) return;
         const btn = document.createElement('a');
         btn.id = 'sse-btn';
         btn.href = '/sse.html';
         btn.target = '_blank';
         btn.innerText = '📡 打开 SSE 实时测试';
         btn.style.cssText = 'display: inline-block; margin-top: 15px; padding: 8px 16px; background-color: #2f3e4e; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.2s;';
         btn.onmouseover = () => btn.style.backgroundColor = '#1a2632';
         btn.onmouseout = () => btn.style.backgroundColor = '#2f3e4e';
         infoContainer.appendChild(btn);
      }
    }, 500);
    runAutoLogin();
    const authInterval = setInterval(() => {
      if (tryAuthorizeFromCache()) {
        clearInterval(authInterval);
      }
    }, 500);
  });
`;

export function setupSwagger(
  app: INestApplication,
  options: SwaggerAutoLoginOptions = {},
): void {
  const config = new DocumentBuilder()
    .setTitle('Demo API')
    .setDescription('Demo API 文档\n\n[🔗 打开 SSE 测试页面](/sse.html)')
    .setVersion('1.0')
    .addTag('auth', '认证授权')
    .addTag('users', '用户管理')
    .addTag('interviews', '面试管理')
    .addTag('test', '测试接口')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customJsStr: buildCustomJsStr(
      options.autoLoginEmail,
      options.autoLoginPassword,
    ),
  });
}
