//Script to add into com.cocos.game package, backup here
package com.cocos.game;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.cocos.lib.JsbBridgeWrapper;

import java.io.FileInputStream;

public class JsbBridge {
    private static AppActivity AppActivityInstance;

    public static void start(AppActivity instance){
        JsbBridge.AppActivityInstance = instance;
        JsbBridgeWrapper jbw = JsbBridgeWrapper.getInstance();

        jbw.addScriptEventListener("setLandscape", arg ->{
            AppActivityInstance.SetLandscape();
        });
        jbw.addScriptEventListener("setPortrait", arg ->{
            AppActivityInstance.SetPortrait();
        });

    }
}

