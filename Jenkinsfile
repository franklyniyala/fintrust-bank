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

    }

    post {
        success {
            echo '✅ SonarQube Analysis Passed'
        }

        failure {
            echo '❌ SonarQube Analysis Failed'
        }
    }
}