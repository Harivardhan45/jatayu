import { Search, Video, Code, TrendingUp, TestTube, BarChart3 } from 'lucide-react';
import type { FeatureType } from '../App';

export interface FeatureConfig {
  id: FeatureType;
  label: string;
  icon: any;
  title: string;
  description: string;
}

export const featureConfigs: Record<NonNullable<FeatureType>, FeatureConfig> = {
  search: {
    id: 'search',
    label: 'AI Powered Search',
    icon: Search,
    title: 'AI Powered Search',
    description: 'Smart search across Confluence pages and files'
  },
  video: {
    id: 'video',
    label: 'Video Summarizer',
    icon: Video,
    title: 'Video Summarizer',
    description: 'AI-powered video summarization and analysis'
  },
  code: {
    id: 'code',
    label: 'Code Assistant',
    icon: Code,
    title: 'Code Assistant',
    description: 'AI-powered code modification and conversion'
  },
  impact: {
    id: 'impact',
    label: 'Impact Analyzer',
    icon: TrendingUp,
    title: 'Impact Analyzer',
    description: 'Analyze documentation and code changes and risks'
  },
  test: {
    id: 'test',
    label: 'Test Support Tool',
    icon: TestTube,
    title: 'Test Support Tool',
    description: 'AI-powered test strategy and workflow generation with analysis'
  },
  image: {
    id: 'image',
    label: 'Chart Builder',
    icon: BarChart3,
    title: 'Chart Builder',
    description: 'AI-powered chart and visualization builder'
  }
};

export const getFeatureConfig = (featureId: FeatureType): FeatureConfig => {
  return featureConfigs[featureId as NonNullable<FeatureType>] || featureConfigs.search;
};

export const features = [
  { id: 'search' as const, label: 'AI Powered Search', icon: Search },
  { id: 'video' as const, label: 'Video Summarizer', icon: Video },
  { id: 'code' as const, label: 'Code Assistant', icon: Code },
  { id: 'impact' as const, label: 'Impact Analyzer', icon: TrendingUp },
  { id: 'test' as const, label: 'Test Support Tool', icon: TestTube },
  { id: 'image' as const, label: 'Chart Builder', icon: BarChart3},
]; 