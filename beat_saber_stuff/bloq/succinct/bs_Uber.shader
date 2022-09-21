// Unity built-in shader source. Copyright (c) 2016 Unity Technologies. MIT license (see license.txt)
// Edited by Ikeiwa for Beat Saber use

Shader "BeatSaber/Uber"
{
    Properties
    {
        [HDR] _Color("Custom Color Tint", Color) = (1,1,1,1)

        _LightColor("Light Color", Color) = (1,1,1)
        _LightDir("Light Direction", Vector) = (0,1,1) 
        _AmbientLight("Ambient Light", Color) = (0.25,0.25,0.25) 
        _Glow("Glow Power", Range(0,1)) = 0

        _DistortionMap("Distortion", 2D) = "grey" {}
        _DistortionIntensity("Distortion Intensity", Float) = 0

        _AlbedoColor("Color", Color) = (1,1,1,1)
        _MainTex("Albedo", 2D) = "white" {}

        _Cutoff("Alpha Cutoff", Range(0.0, 1.0)) = 0.5

        _Glossiness("Smoothness", Range(0.0, 1.0)) = 0.5
        _GlossMapScale("Smoothness Scale", Range(0.0, 1.0)) = 1.0
        [Enum(Metallic Alpha,0,Albedo Alpha,1)] _SmoothnessTextureChannel ("Smoothness texture channel", Float) = 0

        [Gamma] _Metallic("Metallic", Range(0.0, 1.0)) = 0.0
        _MetallicGlossMap("Metallic", 2D) = "white" {}

        [ToggleOff] _SpecularHighlights("Specular Highlights", Float) = 1.0
        [ToggleOff] _GlossyReflections("Glossy Reflections", Float) = 1.0
        [MaterialToggle] _CustomColors("Enable Custom Colors", Float) = 0
        [MaterialToggle] _CustomColorsAlbedo("Tint albedo", Float) = 0
        [MaterialToggle] _CustomColorsEmissive("Tint emission", Float) = 1

        _BumpScale("Scale", Float) = 1.0
        _BumpMap("Normal Map", 2D) = "bump" {}

        _Parallax ("Height Scale", Range (0.005, 0.08)) = 0.02
        _ParallaxMap ("Height Map", 2D) = "black" {}

        _OcclusionStrength("Strength", Range(0.0, 1.0)) = 1.0
        _OcclusionMap("Occlusion", 2D) = "white" {}

        _EmissionColor("Color", Color) = (0,0,0)
        _EmissionMap("Emission", 2D) = "white" {}

        _DetailMask("Detail Mask", 2D) = "white" {}

        _DetailAlbedoMap("Detail Albedo x2", 2D) = "grey" {}
        _DetailNormalMapScale("Scale", Float) = 1.0
        _DetailNormalMap("Normal Map", 2D) = "bump" {}

        [Enum(UV0,0,UV1,1)] _UVSec ("UV Set for secondary textures", Float) = 0

        [Enum(Off,0,Front,1,Back,2)] _Culling ("Cull", Int) = 2


        // Blending state
        [HideInInspector] _Mode ("__mode", Float) = 0.0
        [HideInInspector] _SrcBlend ("__src", Float) = 1.0
        [HideInInspector] _DstBlend ("__dst", Float) = 0.0
        [HideInInspector] _ZWrite ("__zw", Float) = 1.0
        [HideInInspector] _ColorMask ("__colormask", Float) = 15.0
    }

    CGINCLUDE
        #define UNITY_SETUP_BRDF_INPUT MetallicSetup
    ENDCG

    SubShader
    {
        Tags { "RenderType"="Opaque" "PerformanceChecks"="False" }
        LOD 300

        Cull [_Culling]
        ColorMask [_ColorMask]

        GrabPass
        {
            Tags { "LightMode" = "Always" }
            "_SceneColor"
        }

        // ------------------------------------------------------------------
        //  Base forward pass (directional light, emission, lightmaps, ...)
        Pass
        {
            Name "FORWARD"
            Tags { "LightMode" = "ForwardBase"}

            Blend [_SrcBlend] [_DstBlend]
            ZWrite [_ZWrite]

            CGPROGRAM
            #pragma target 3.0

            // -------------------------------------

            #pragma shader_feature _NORMALMAP
            #pragma shader_feature _ _ALPHATEST_ON _ALPHABLEND_ON _GRABPASS_ON 
            #pragma shader_feature _EMISSION
            #pragma shader_feature _METALLICGLOSSMAP
            #pragma shader_feature ___ _DETAIL_MULX2
            #pragma shader_feature _ _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A
            #pragma shader_feature _ _SPECULARHIGHLIGHTS_OFF
            #pragma shader_feature _ _GLOSSYREFLECTIONS_OFF
            #pragma shader_feature _PARALLAXMAP
            #pragma shader_feature _TINT_ALBEDO
            #pragma shader_feature _TINT_EMISSION

            
            #pragma multi_compile_fwdbase
            #pragma multi_compile_instancing

            #pragma vertex vertBase
            #pragma fragment fragBase

            #include "BSStandardCoreForward.cginc"

            ENDCG
        }
    }


    FallBack "VertexLit"
    CustomEditor "BSStandardShaderGUI"
}
