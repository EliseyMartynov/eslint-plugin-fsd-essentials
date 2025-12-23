import layerImports from './lib/rules/layer-imports';

export = {
  rules: {
    'layer-imports': layerImports,
  },
  configs: {
    recommended: {
      rules: {
        'fsd-essentials/layer-imports': ['error', {
          srcPath: '/src/',
          aliasPrefix: '@',
        }],
      },
    },
  },
};
