pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                credentialsId: 'GITHUB_LOGIN',
                url: 'https://github.com/franklyniyala/fintrust-bank.git'
            }
        }

        stage('Run Sonarqube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh '''
                    docker run --rm \
                    -e SONAR_TOKEN=$SONAR_TOKEN \
                    -v $(pwd):/usr/src \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=frank_org-fintrust \
                    -Dsonar.organization=frank_org \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=https://sonarcloud.io \
                    '''
                }
            }
        }

        stage('Run Snyk Analysis') {
            steps {
                withCredentials([string(credentialsId: "SNYK_TOKEN", variable: 'SNYK_TOKEN')]) {
                    sh '''
                    docker run --rm \
                    -e SNYK_TOKEN=$SNYK_TOKEN \
                    -v $(pwd):/app \
                    snyk/snyk-cli test
                    '''
                }
            }
        }

    }

    post {
        success {
            echo '✅ SonarQube Analysis Passed'
            echo '✅ Snyk Analysis Passed'
        }

        failure {
            echo '❌ SonarQube Analysis Failed'
            echo '❌ Snyk Analysis Failed'
        }
    }
}