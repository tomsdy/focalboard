package config

import (
	"log"

	"github.com/spf13/viper"
)

const (
	DefaultServerRoot = "http://localhost:8000"
	DefaultPort       = 8000
)

// Configuration is the app configuration stored in a json file.
type Configuration struct {
	ServerRoot              string   `json:"serverRoot" mapstructure:"serverRoot"`
	Port                    int      `json:"port" mapstructure:"port"`
	DBType                  string   `json:"dbtype" mapstructure:"dbtype"`
	DBConfigString          string   `json:"dbconfig" mapstructure:"dbconfig"`
	UseSSL                  bool     `json:"useSSL" mapstructure:"useSSL"`
	SecureCookie            bool     `json:"secureCookie" mapstructure:"secureCookie"`
	WebPath                 string   `json:"webpath" mapstructure:"webpath"`
	FilesPath               string   `json:"filespath" mapstructure:"filespath"`
	Telemetry               bool     `json:"telemetry" mapstructure:"telemetry"`
	WebhookUpdate           []string `json:"webhook_update" mapstructure:"webhook_update"`
	Secret                  string   `json:"secret" mapstructure:"secret"`
	SessionExpireTime       int64    `json:"session_expire_time" mapstructure:"session_expire_time"`
	SessionRefreshTime      int64    `json:"session_refresh_time" mapstructure:"session_refresh_time"`
	LocalOnly               bool     `json:"localonly" mapstructure:"localonly"`
	EnableLocalMode         bool     `json:"enableLocalMode" mapstructure:"enableLocalMode"`
	LocalModeSocketLocation string   `json:"localModeSocketLocation" mapstructure:"localModeSocketLocation"`

	AuthMode               string `json:"authMode" mapstructure:"authMode"`
	MattermostURL          string `json:"mattermostURL" mapstructure:"mattermostURL"`
	MattermostClientID     string `json:"mattermostClientID" mapstructure:"mattermostClientID"`
	MattermostClientSecret string `json:"mattermostClientSecret" mapstructure:"mattermostClientSecret"`
}

// ReadConfigFile read the configuration from the filesystem.
func ReadConfigFile() (*Configuration, error) {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.SetConfigType("json")   // REQUIRED if the config file does not have the extension in the name
	viper.AddConfigPath(".")      // optionally look for config in the working directory
	viper.SetEnvPrefix("focalboard")
	viper.AutomaticEnv() // read config values from env like FOCALBOARD_SERVERROOT=...
	viper.SetDefault("ServerRoot", DefaultServerRoot)
	viper.SetDefault("Port", DefaultPort)
	viper.SetDefault("DBType", "sqlite3")
	viper.SetDefault("DBConfigString", "./octo.db")
	viper.SetDefault("SecureCookie", false)
	viper.SetDefault("WebPath", "./pack")
	viper.SetDefault("FilesPath", "./files")
	viper.SetDefault("Telemetry", true)
	viper.SetDefault("WebhookUpdate", nil)
	viper.SetDefault("SessionExpireTime", 60*60*24*30) // 30 days session lifetime
	viper.SetDefault("SessionRefreshTime", 60*60*5)    // 5 minutes session refresh
	viper.SetDefault("LocalOnly", false)
	viper.SetDefault("EnableLocalMode", false)
	viper.SetDefault("LocalModeSocketLocation", "/var/tmp/focalboard_local.socket")

	viper.SetDefault("AuthMode", "native")

	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		return nil, err
	}

	configuration := Configuration{}

	err = viper.Unmarshal(&configuration)
	if err != nil {
		return nil, err
	}

	log.Println("readConfigFile")
	log.Printf("%+v", removeSecurityData(configuration))

	return &configuration, nil
}

func removeSecurityData(config Configuration) Configuration {
	clean := config
	clean.Secret = "hidden"
	clean.MattermostClientID = "hidden"
	clean.MattermostClientSecret = "hidden"

	return clean
}
