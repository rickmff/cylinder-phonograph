// The compiled shader programs.

import { program } from './gl-util.js';
import { FS_BG, FS_BLUR, FS_COMP, FS_DOWN, FS_ENV, FS_IRR, FS_MAIN, FS_PRE, FS_PREF, FS_SHADOW, FS_SSAO, FS_UP, VS_FS, VS_MAIN, VS_PATCH, VS_SHADOW } from './shaders.js';

const P_main=program(VS_MAIN,FS_MAIN),P_patch=program(VS_PATCH,FS_MAIN),P_pre=program(VS_MAIN,FS_PRE),P_sh=program(VS_SHADOW,FS_SHADOW);
const P_env=program(VS_FS,FS_ENV),P_pref=program(VS_FS,FS_PREF),P_irr=program(VS_FS,FS_IRR),P_bg=program(VS_FS,FS_BG);
const P_ssao=program(VS_FS,FS_SSAO),P_blur=program(VS_FS,FS_BLUR),P_down=program(VS_FS,FS_DOWN),P_up=program(VS_FS,FS_UP),P_comp=program(VS_FS,FS_COMP),P_patchSh=program(VS_PATCH,FS_SHADOW);

export { P_bg, P_blur, P_comp, P_down, P_env, P_irr, P_main, P_patch, P_patchSh, P_pre, P_pref, P_sh, P_ssao, P_up };
