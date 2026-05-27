import { CustomNodeComponent } from './CustomNodeComponent';
import { LayerHeaderNodeComponent } from './LayerHeaderNode';
import { LayerSwimlaneComponent } from './LayerSwimlaneNode';
import { BusinessStepNodeComponent } from './BusinessStepNode';

export const nodeTypesMap = {
  custom: CustomNodeComponent,
  layerHeader: LayerHeaderNodeComponent,
  layerSwimlane: LayerSwimlaneComponent,
  businessStep: BusinessStepNodeComponent
};
