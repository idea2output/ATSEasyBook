const isImposition = process.cwd().replace(/\\/g, '/').includes('/imposition');

const postcssConfig = isImposition
  ? { plugins: {} }
  : {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    };

export default postcssConfig;
