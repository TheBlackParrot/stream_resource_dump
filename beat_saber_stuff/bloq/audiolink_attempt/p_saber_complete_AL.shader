Shader "BeatSaber P/Complete AL"
{
	Properties
	{
		[Header(Main Options)]
		_Color ("Glow Color [Uses CustomColors]", Color) = (1,1,1,1)
		_ColorTex ("Glow Texture", 2D) = "white" {}

		_Diff("Diffuse Color", Color) = (1,1,1,0)
		_CustomDiff("CutomColors -> Diffuse", Range(0, 1)) = 0
		_DiffTex("Diffuse Texture", 2D) = "white" {}
		_Normal ("Normal Map", 2D) = "bump" {}
		_LightDir("Light Direction", Vector) = (-1,-1,0,1)
		_Ambient("Ambient Lighting", Range(0, 1)) = 0

		_SpecColor("Reflection Color", Color) = (1,1,1,0)
		_CustomSpec("CutomColors -> Reflection", Range(0, 1)) = 0
		_Cube("Reflection Map", Cube) = "" {}
		_SpecAmount ("Specularity", Range(0, 64)) = 10
		_TexSize ("Texture Pixels", Range(0, 65536)) = 0
		_ReflTexSize("Reflection Pixels", Range(0, 65536)) = 0

		_TexCut ("Cut Diffuse <-> Glow [Texture]", Range(0, 1)) = 0
		_GlowCut ("Cut Diffuse <-> Glow [Reflection]", Range(0, 1)) = 0
		_TexDisCut ("Cut Invisible <-> Visible [Texture]", Range(0, 1)) = 1
		_DisCut ("Cut Invisible <-> Visible [Reflection]", Range(0, 1)) = 1

		_Glow("This Makes CustomColors Work", Range(1, 1)) = 1

		[Header(AudioLink)]
		[Space(10)]
		[MaterialToggle]_ALEnable("Enable AudioLink", Float) = 0
		_ALDelay("Global Delay", Range(0, 1)) = 0
        	[Space(10)]
		_ALGlowMult("Glow Multiplier", Range(0, 10)) = 1.5
		_ALGlowSmoothing("Smoothing", Range(0, 1)) = 0.6
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
			// make fog work
			#pragma multi_compile_fog
			
			#include "UnityCG.cginc"
			#include "Assets/AudioLink/Shaders/AudioLink.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				float2 uv : TEXCOORD0;
				float3 normal : NORMAL;
				float4 tangent : TANGENT;
			};

			struct v2f
			{
				float2 uv : TEXCOORD0;
				float4 vertex : SV_POSITION;
				float4 worldPos : TEXCOORD1;

				half3 normalWorld : TEXCOORD2;
				half3 tangentWorld : TEXCOORD3;
				half3 binormalWorld : TEXCOORD4;

				float3 viewDir : TEXCOORD5;
				//float3 normal : NORMAL;
			};

			float4 _Color;
			sampler2D _ColorTex;
			float4 _ColorTex_ST;

			float4 _Diff;
			float _CustomDiff;
			sampler2D _DiffTex;
			float4 _DiffTex_ST;
			sampler2D _Normal;
			float4 _Normal_ST;
			float3 _LightDir;
			float _Ambient;

			float4 _SpecColor;
			float _CustomSpec;
			uniform samplerCUBE _Cube;
			float _SpecAmount;
			float _TexSize;
			float _ReflTexSize;

			float _TexCut;
			float _GlowCut;
			float _TexDisCut;
			float _DisCut;

	    		//AudioLink Stuff
            		float _ALEnable;
            		float _ALGlowMult;
	                float _ALGlowBand;
			float _ALDistSmoothing;
			float _ALDistSizeSmoothing;
	                float _ALGlowSmoothing;
            		float _ALDelay;
			
			v2f vert (appdata v)
			{
				v2f o;
				o.vertex = UnityObjectToClipPos( v.vertex);
				o.uv = v.uv;
				o.worldPos = mul(unity_ObjectToWorld, v.vertex);
				o.viewDir = normalize(UnityWorldSpaceViewDir(o.worldPos));
				//o.normal = UnityObjectToWorldNormal(v.normal);

				o.tangentWorld = normalize(mul(unity_ObjectToWorld, float4(v.tangent.xyz, 0.0)).xyz);
				o.normalWorld = normalize(mul(float4(v.normal, 0.0), unity_WorldToObject).xyz);
				o.binormalWorld = normalize(cross(o.normalWorld, o.tangentWorld) * v.tangent.w);

				return o;
			}
			
			fixed4 frag (v2f i) : SV_Target
			{
				// Texture Maps
				fixed4 tNormal =       tex2D(_Normal  , TRANSFORM_TEX(i.uv, _Normal  ));
				fixed4 diff = _Diff  * tex2D(_DiffTex , TRANSFORM_TEX(i.uv, _DiffTex ));
				fixed4 glow = _Color * tex2D(_ColorTex, TRANSFORM_TEX(i.uv, _ColorTex));
				if (_TexSize != 0)
				{
					tNormal =       tex2D(_Normal  , floor(TRANSFORM_TEX(i.uv, _Normal  ) * _TexSize) / _TexSize);
					diff = _Diff  * tex2D(_DiffTex , floor(TRANSFORM_TEX(i.uv, _DiffTex ) * _TexSize) / _TexSize);
					glow = _Color * tex2D(_ColorTex, floor(TRANSFORM_TEX(i.uv, _ColorTex) * _TexSize) / _TexSize);
				}

				// Discard dark parts of the diffuse texture
				if (1 - _TexDisCut > max(max(diff.r, diff.g), diff.b))
				{
					discard;
				}

				// Add Custom color to diffuse if required
				diff = diff * ((_Color * _CustomDiff) + (1 - _CustomDiff));

				// unpackNormal Function
				half3 localCoords = fixed3(2.0 * tNormal.rg - fixed2(1.0,1.0), 0.0);
				localCoords.z = 1.0;

				// Normal Transpose Matrix
				fixed3x3 local2WorldTranspose = fixed3x3(
					i.binormalWorld,
					i.tangentWorld,
					i.normalWorld
				);
				// Calculate Normal Direction
				fixed3 normalDir = normalize(mul(normalize(localCoords), local2WorldTranspose));

				// Calculate Diffuse Lighting
				fixed3 lightDir = normalize(_LightDir.xyz) * -1.0;
				fixed shadow = max(dot(lightDir, normalDir), 0);

				// Calculate Specular lighting using fake reflections
				fixed3 reflDir = reflect(i.viewDir, normalize(normalDir)); // Get direction of reflection

				// Pixelise the reflection texture
				if (_ReflTexSize != 0)
				{
					reflDir = floor(reflDir * _ReflTexSize) / _ReflTexSize;
				}

				float high_limit = 0.9;
				float low_limit = 0.05;
				float multiplicative_value = 1.8;
				float col_brightness_factor = 1 - ((_Color.r * 299 + _Color.g * 587 + _Color.b * 114) / 1000);
				float max_glow = 0.825 * col_brightness_factor;
				float min_glow = 0.1;

				//AudioLink
				float GlowAudioLink = lerp(AudioLinkLerp( ALPASS_AUDIOLINK + float2( _ALDelay, _ALGlowBand ) ).r, AudioLinkLerp( ALPASS_FILTEREDAUDIOLINK + float2( _ALGlowMult, _ALGlowBand ) ).r, _ALGlowSmoothing);

				if (_ALEnable != 0)
        			{
					_Ambient += GlowAudioLink * _ALGlowMult;
					//_SpecAmount -= (GlowAudioLink * _ALGlowMult)/10;
					high_limit = lerp(high_limit, 1.0, GlowAudioLink);
					multiplicative_value = lerp(multiplicative_value, multiplicative_value*1.2, GlowAudioLink);
					max_glow *= GlowAudioLink * _ALGlowMult;
					min_glow *= GlowAudioLink * _ALGlowMult;

					if(_Color.r > 0.5) {
						_Color.r = lerp(_Color.r, 1.0, (GlowAudioLink/2));
					} else {
						_Color.r = lerp(_Color.r, 0.0, (GlowAudioLink/1.3));
					}

					if(_Color.g > 0.5) {
						_Color.g = lerp(_Color.g, 1.0, (GlowAudioLink/2));
					} else {
						_Color.g = lerp(_Color.g, 0.0, (GlowAudioLink/1.3));
					}

					if(_Color.b > 0.5) {
						_Color.b = lerp(_Color.b, 1.0, (GlowAudioLink/2));
					} else {
						_Color.b = lerp(_Color.b, 0.0, (GlowAudioLink/1.3));
					}

					_Color = lerp(_Color, 1.0, GlowAudioLink/14);

					col_brightness_factor = 1 - ((_Color.r * 299 + _Color.g * 587 + _Color.b * 114) / 1000);
					max_glow = 0.825 * col_brightness_factor;
				}

				fixed3 reflection_all = texCUBE(_Cube, reflDir);
				if(reflection_all.r > high_limit) { reflection_all.r = high_limit; }
				if(reflection_all.g > high_limit) { reflection_all.g = high_limit; }
				if(reflection_all.b > high_limit) { reflection_all.b = high_limit; }
				if(reflection_all.r < low_limit) { reflection_all.r = low_limit; }
				if(reflection_all.g < low_limit) { reflection_all.g = low_limit; }
				if(reflection_all.b < low_limit) { reflection_all.b = low_limit; }
				fixed reflection = max(((reflection_all.r + reflection_all.g + reflection_all.b)-0.1)/3.0, 0.0);


				// Apply cutout
				if (_DisCut < reflection)
				{
					discard;
				}

				fixed4 spec = (pow(reflection, _SpecAmount)) * (_Color * _CustomSpec); // Use reflection value to add color to the material

				// Apply Diffuse and specular lighting
				fixed4 col = diff * (diff * (_Ambient) * shadow) + spec;
				col.r = min(col.r * multiplicative_value, 1.0);
				col.g = min(col.g * multiplicative_value, 1.0);
				col.b = min(col.b * multiplicative_value, 1.0);
				col.a = lerp(min_glow, max_glow, (col.r + col.g + col.b)/3);

				// Apply glow texture
				if (1 - _GlowCut < reflection || _TexCut > max(max(diff.r, diff.g), diff.b)) //If the reflection is brighter than _GlowCut, the material uses the glow material instead
				{
					col = glow;
				}

				return col;
			}
			ENDCG
		}
	}
}