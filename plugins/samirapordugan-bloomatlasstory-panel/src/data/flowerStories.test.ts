import { FLOWER_STORIES, findFlowerStory } from './flowerStories';

describe('Flower Story demo records', () => {
  it('contains twelve unique story identifiers', () => {
    expect(FLOWER_STORIES).toHaveLength(12);
    expect(new Set(FLOWER_STORIES.map((flower) => flower.flowerId)).size).toBe(12);
  });
  it('resolves the flower selected on World Explorer', () => {
    expect(findFlowerStory('iris-germanica')?.scientificName).toBe('Iris germanica');
    expect(findFlowerStory('protea-cynaroides')?.commonName).toBe('King Protea');
  });
  it('does not silently replace an invalid flowerId with another flower', () => {
    expect(findFlowerStory('invalid-flower')).toBeUndefined();
  });
});
