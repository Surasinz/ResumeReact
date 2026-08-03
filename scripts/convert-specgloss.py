"""
Rewrite KHR_materials_pbrSpecularGlossiness materials as standard
metallic-roughness.

three.js dropped support for that extension, so a model using it loads with
every material defaulted to plain white and no texture bound -- which is what
made the hacker room render as a colourless shape. The textures are present in
the file the whole time; they are just referenced from inside an extension the
loader now ignores.

The mapping is the one from the extension's own archival note: the diffuse
channel becomes base colour, roughness is the inverse of glossiness, and metal
is zero, since a spec-gloss material with a dark specular factor is a
dielectric.

Usage: python convert-specgloss.py <in.glb> <out.glb>
"""

import sys
from pygltflib import GLTF2

SPEC_GLOSS = "KHR_materials_pbrSpecularGlossiness"


def convert(src, dst):
    gltf = GLTF2().load(src)
    converted = 0
    skipped = 0

    for material in gltf.materials or []:
        extensions = material.extensions or {}
        spec = extensions.get(SPEC_GLOSS)
        if not spec:
            skipped += 1
            continue

        diffuse_factor = spec.get("diffuseFactor", [1, 1, 1, 1])
        diffuse_texture = spec.get("diffuseTexture")
        glossiness = spec.get("glossinessFactor", 1.0)

        pbr = {
            "baseColorFactor": diffuse_factor,
            "metallicFactor": 0.0,
            "roughnessFactor": max(0.0, min(1.0, 1.0 - glossiness)),
        }
        if diffuse_texture is not None:
            pbr["baseColorTexture"] = diffuse_texture

        material.pbrMetallicRoughness = pbr
        # Drop the extension so nothing downstream tries to read it back.
        extensions.pop(SPEC_GLOSS, None)
        material.extensions = extensions
        converted += 1

    if gltf.extensionsUsed:
        gltf.extensionsUsed = [e for e in gltf.extensionsUsed if e != SPEC_GLOSS]
    if gltf.extensionsRequired:
        gltf.extensionsRequired = [
            e for e in gltf.extensionsRequired if e != SPEC_GLOSS
        ]

    gltf.save(dst)
    return converted, skipped


if __name__ == "__main__":
    made, left = convert(sys.argv[1], sys.argv[2])
    print(f"converted {made} materials, left {left} untouched -> {sys.argv[2]}")
