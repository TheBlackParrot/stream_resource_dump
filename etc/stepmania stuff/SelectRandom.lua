-- used various parts of Simply Love 5.4.0 for reference, drop in Appearance/Themes/Simply Love/Modules
-- press Shift+R in the song select screen to randomly choose a map from all packs

local t = {}

local holdingShift = false

local SelectRandomSongHandler = function(event)
	if not event then return end

	if event.type == "InputEventType_FirstPress" then
		if event.DeviceInput.button == "DeviceButton_left shift" then
			holdingShift = true
		elseif event.DeviceInput.button == "DeviceButton_r" then
			if holdingShift then
				local wheel = SCREENMAN:GetTopScreen():GetMusicWheel()
				local randomSong = SONGMAN:GetRandomSong()

				GAMESTATE:SetPreferredSong(randomSong)
				wheel:SelectSong(randomSong)
				wheel:Move(1)
				wheel:Move(-1)
				wheel:Move(0)
			end
		end
	elseif event.type == "InputEventType_Release" then
		if event.DeviceInput.button == "DeviceButton_left shift" then
			holdingShift = false
		end
	end
end

t["ScreenSelectMusic"] = Def.ActorFrame {
	ModuleCommand=function(self)
		if PREFSMAN:GetPreference("EventMode") and not GAMESTATE:IsCourseMode() then
			SCREENMAN:GetTopScreen():AddInputCallback(SelectRandomSongHandler)
		end
	end
}

return t