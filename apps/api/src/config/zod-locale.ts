import { z } from 'zod';

// Default validation messages in Spanish; schemas in @coffeeroute/shared override the important ones.
z.config(z.locales.es());
