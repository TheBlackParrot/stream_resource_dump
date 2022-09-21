// Upgrade NOTE: replaced '_Object2World' with 'unity_ObjectToWorld'

Shader "BeatSaber/Unlit Glow AL"
{
	Properties
	{
		_Color ("Color", Color) = (1,1,1,1)
		_Tex ("Texture", 2D) = "white" {}
		_Glow ("Glow", Range (0, 1)) = 0

		[Header(AudioLink)]
		[Space(10)]
		[MaterialToggle]_ALEnable("Enable AudioLink", Float) = 0
		_ALDelay("Global Delay", Range(0, 1)) = 0
        	[Space(10)]
		_ALGlowMult("Glow Multiplier", Range(0, 10)) = 8
		_ALGlowSmoothing("Smoothing", Range(0, 1)) = 0.8
		[Enum(BASS, 0, LOW MID, 1, HIGH MID, 2, TREBLE, 3)]_ALGlowBand("Reactive Audio Band", Range(0, 3)) = 0 
	}
	SubShader
	{
		Tags { "RenderType"="Opaque" }
		LOD 100

		Pass
		{
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			
			#include "UnityCG.cginc"
			#include "Assets/AudioLink/Shaders/AudioLink.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				fixed4 color : COLOR;
				float2 uv : TEXCOORD0;
				UNITY_VERTEX_INPUT_INSTANCE_ID
			};

			struct v2f
			{
				float2 uv : TEXCOORD0;
				float4 vertex : SV_POSITION;
				half4 color : COLOR;
			};

			float4 _Color;
			float _Glow;

			sampler2D _Tex;
			float4 _Tex_ST;

	    		//AudioLink Stuff
            		float _ALEnable;
			float _ALSpeedMulty;
			float _ALSpeedMultz;
	                float _ALSpeedBandz;
			float _ALSpeedBandy;
            		float _ALGlowMult;
	                float _ALGlowBand;
			float _ALDistSmoothing;
			float _ALDistSizeSmoothing;
	                float _ALGlowSmoothing;
            		float _ALDelay;
			float4 _ColorAL;
			
			v2f vert (appdata v)
			{
				v2f o;
				o.vertex = UnityObjectToClipPos(v.vertex);
				o.uv = v.uv;
				o.color = v.color;
				return o;
			}
			
			fixed4 frag (v2f i) : SV_Target
			{
				//AudioLink
				float GlowAudioLink = lerp(AudioLinkLerp( ALPASS_AUDIOLINK + float2( _ALDelay, _ALGlowBand ) ).r, AudioLinkLerp( ALPASS_FILTEREDAUDIOLINK + float2( _ALGlowMult, _ALGlowBand ) ).r, _ALGlowSmoothing);

				if (_ALEnable != 0)
        			{
					_Glow += GlowAudioLink * _ALGlowMult;
					_ColorAL = float4(lerp(0.67, 1.0, GlowAudioLink), lerp(0.67, 1.0, GlowAudioLink), lerp(0.67, 1.0, GlowAudioLink), 1.0);
				}

				// sample the texture
				fixed4 col = _ColorAL * tex2D(_Tex, TRANSFORM_TEX(i.uv, _Tex));

				return col * float4(1.0,1.0,1.0,_Glow*2) * i.color;
			}
			ENDCG
		}
	}
}
