

TravelWeather Pro
Aplicación interactiva de clima y recomendaciones de viaje desarrollada por Daniel Burgos para la clase de Diseño Front-End.

Descripción
TravelWeather Pro es un dashboard inteligente que utiliza la API de OpenWeatherMap para transformar datos meteorológicos en una experiencia de usuario personalizada. El sistema analiza el clima en tiempo real para ofrecer sugerencias de salud, alimentación y vestimenta.

Funcionalidades de Alto Nivel
Arquitectura de Resiliencia (Circuit Breaker): El código implementa una lógica de manejo de errores robusta que actúa como un Circuit Breaker básico, evitando que la aplicación colapse si la API falla o si la ciudad no es encontrada, asegurando una experiencia fluida.

Zero Config & Setup: La aplicación está diseñada para ser "Plug & Play". No requiere la descarga de dependencias, instalación de Node.js, npm, ni configuraciones de terminal adicionales.

Temas Dinámicos Adaptativos: La interfaz detecta la temperatura y la hora local de la ciudad consultada para cambiar automáticamente entre temas fríos, cálidos o Modo Noche (basado en el sunset real).

Asistente de Viaje Inteligente:

¿Qué vestir?: Recomendaciones de ropa (ligera, abrigadora o impermeable) analizando la temperatura y descripción del clima.

Gastronomía Regional: Sugerencias basadas en la cultura de Hermosillo, Sonora, recomendando platillos como Tacos de Asada en calor o Caldo de Queso en lluvia/frío.

Índice de Salud (AQI): Monitoreo en tiempo real de la calidad del aire para informar riesgos potenciales al realizar actividades al aire libre.

Modo Comparativo: Interfaz de doble columna para analizar dos destinos simultáneamente [cite: 2026-02-16].

Tecnologías y Herramientas
Front-End: HTML5 Semántico y CSS3 con Tailwind CSS (vía CDN para máxima ligereza).

Lógica: JavaScript Vanilla (ES6+) con manejo de Fetch API asíncrono y LocalStorage para persistencia de favoritos.

Mapas: Integración de Leaflet.js con capas de calor térmico en tiempo real [cite: 2026-02-16].

Instrucciones de Ejecución
Clonar el repositorio: git clone https://github.com/danielBrurgos/TravelWeather-Pro.git [cite: 2026-02-16]

Ejecutar: Simplemente abre index.html en tu navegador favorito. No se requiere instalar nada adicional.

Enlaces
Sitio en vivo: https://danielbrurgos.github.io/TravelWeather-Pro/

Repositorio: https://github.com/danielBrurgos/TravelWeather-Pro.git

Enlaces
Sitio en vivo: https://danielbrurgos.github.io/TravelWeather-Pro/
Repositorio: https://github.com/danielBrurgos/TravelWeather-Pro.git
<img width="1298" height="634" alt="image" src="https://github.com/user-attachments/assets/0187c3b5-8fb8-4dac-ad6e-597047f26d28" />
<img width="1299" height="633" alt="image" src="https://github.com/user-attachments/assets/4535f586-dab5-4132-9a83-a210c799d7dc" />
<img width="1298" height="623" alt="image" src="https://github.com/user-attachments/assets/45e33f1d-aeb8-4b0e-a965-d6bb8251d9a0" />
<img width="1299" height="637" alt="image" src="https://github.com/user-attachments/assets/5e622150-7cd3-4610-841a-c119502343fc" />


