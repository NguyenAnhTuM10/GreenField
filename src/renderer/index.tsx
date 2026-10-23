import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {VideoRenderer} from './VideoRenderer';
import data from './generated-timeline.json';
import type {CompiledTimeline} from '../engine/types';
const timeline=data as CompiledTimeline;
const Root:React.FC=()=> <Composition id="KnowledgeStudio" component={VideoRenderer}
 width={720} height={1280} fps={30} durationInFrames={Math.max(1,timeline.durationInFrames)}
 defaultProps={{timeline}} calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames})}/>;
registerRoot(Root);
