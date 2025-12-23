import layerImports from './lib/rules/layer-imports';

export = {
  rules: {
    'layer-imports': layerImports,
  },
  configs: {
    recommended: {
      rules: {
        'fsd/layer-imports': ['error', {}],
      },
    },
    custom: {
      rules: {
        'fsd/layer-imports': ['error', {
          srcPath: '/src/',
          aliasPrefix: '@',
        }],
      },
    },
  },
};
